---
title: MapperScannerConfigurer的basePackage匹配逻辑
date: 2017-01-02
description: spring-mybatis配置mapper scan时因包名配置不当，导致mapper类无法被载入spring上下文
categories: "java"
tags: ["mybatis","spring"]
slug: "MapperScannerConfigurer-basePackage-scan-logic"
aliases: ['/blog/2017/01/02/MapperScannerConfigurer-basePackage-scan-logic.html']
---


最近配置spring、mybatis框架时，遇到了无法找到mapper类的问题。最后发现是`MapperScannerConfigurer`的*basePackage*配置的问题。

项目mapper类存放目录

> com/leeyee/xcode/mapper/*Mapper.java

当配置basePackage属性为`com.leeyee.xcode.mapper.*` 时，是扫描不到对应mapper文件的。因为`com.leeyee.xcode.mapper.*` 实际匹配的是

> com/leeyee/xcode/mapper/文件夹/*Mapper.class

所以正确的配置是`com.leeyee.xcode.mapper`或者`com.leeyee.xcode.mapper.**`

之前一直没有注意到这个问题，想当然的认为`com.leeyee.xcode.mapper.*`就应该匹配到mapper文件夹下的所有\*Mapper.class类，因此当将\*Mapper.java文件从com/leeyee/xcode/mapper/order/目录下移到/mapper/下时，原`com.leeyee.xcode.mapper.*` 配置就不起作用了。

看了下源码，针对包含通配符的扫描包，spring容器处理流程基本如下：

1.  获取basePackage配置，并根据分割符（*逗号、分号、空格、换行符*）进行拆分，拆分成多个**待扫描包**
2.  将**待扫描包**转换成路径，并构造成以 **classpath\*:** 为前缀，**\*\*/*.class** 为后缀的**完全搜索路径**
3.  将**完全搜索路径**（`classpath*:com/leeyee/xcode/dao/*/**/*.class`）分解成包含通配符的**待匹配路径**（`/com/leeyee/xcode/dao/*/**/*.class`）和不包含通配**根路径**（`/com/leeyee/xcode/dao/`）的**无前缀**完全路径[^comment]。
4. 通过文件类递归**根路径**及其子路径下的所有资源文件（.class）
5. 将**根路径**下资源文件的**实际路径**与**待匹配路径**进行匹配。
	1. 将**根路径**根据文件路径分隔符拆分成路径令牌（`String [] {com,leeyee,xcode,dao}`）；
	2. 将**待匹配路径**同样拆分成路径令牌。不同的是，针对通配符进行正则处理；
	3. 进行相同位置路径令牌匹配

关于路径包含通配符（`findPathMatchingResources`）的处理涉及到以下类和方法：

	# 扫描类处理
	MapperScannerConfigurer.java#postProcessBeanDefinitionRegistry
	ClassPathBeanDefinitionScanner.java#scan
	ClassPathBeanDefinitionScanner.java#doScan
	ClassPathScanningCandidateComponentProvider.java#findCandidateComponents
	PathMatchingResourcePatternResolver.java#getResources
	# 做通配路径匹配
	PathMatchingResourcePatternResolver.java#findPathMatchingResources
	PathMatchingResourcePatternResolver.java#doFindPathMatchingFileResources
	PathMatchingResourcePatternResolver.java#doFindMatchingFileSystemResources
	# 检索匹配文件——递归处理“根”路径下的文件夹及文件
	PathMatchingResourcePatternResolver.java#retrieveMatchingFiles
	PathMatchingResourcePatternResolver.java#doRetrieveMatchingFiles
	# 核心匹配类——目标文件与配置扫描路径的匹配
	AntPathMatcher.java#matchStart
	AntPathMatcher.java#doMatch
	AntPathMatcher.java#tokenizePattern
	AntPathMatcher.java#tokenizePath
	AntPathMatcher.java#getStringMatcher

其中最核心的处理代码为：

/home/repo/org/springframework/spring-core/4.2.5.RELEASE/spring-core-4.2.5.RELEASE-sources.jar!/org/springframework/core/io/support/PathMatchingResourcePatternResolver.java

    /**
     * 递归检索匹配给定模式的文件，并将其存放在指定的结果集合中
     * Recursively retrieve files that match the given pattern,
     * adding them to the given result list.
     *
     * @param fullPattern the pattern to match against,
     *                    with prepended root directory path
     * @param dir         the current directory
     * @param result      the Set of matching File instances to add to
     * @throws IOException if directory contents could not be retrieved
     */
    protected void doRetrieveMatchingFiles(String fullPattern, File dir, Set<File> result) throws IOException {
        if (logger.isDebugEnabled()) {
            logger.debug("Searching directory [" + dir.getAbsolutePath() +
                    "] for files matching pattern [" + fullPattern + "]");
        }
        // 获取当前目录下的所有文件夹及文件
        File[] dirContents = dir.listFiles();
        if (dirContents == null) {
            if (logger.isWarnEnabled()) {
                logger.warn("Could not retrieve contents of directory [" + dir.getAbsolutePath() + "]");
            }
            return;
        }
        for (File content : dirContents) {
            String currPath = StringUtils.replace(content.getAbsolutePath(), File.separator, "/");
            // 如果当前目录是文件夹，并且当前文件夹的路径与搜索全路径的开始部分匹配
            if (content.isDirectory() && getPathMatcher().matchStart(fullPattern, currPath + "/")) {
                if (!content.canRead()) {
                    if (logger.isDebugEnabled()) {
                        logger.debug("Skipping subdirectory [" + dir.getAbsolutePath() +
                                "] because the application is not allowed to read the directory");
                    }
                } else {
                    // 递归当前文件夹下的文件
                    doRetrieveMatchingFiles(fullPattern, content, result);
                }
            }
            // 如果当前目录是文件，那么则判断文件路径是否和搜索全路径完全匹配
            if (getPathMatcher().match(fullPattern, currPath)) {
                result.add(content);
            }
        }
    }

/home/repo/org/springframework/spring-core/4.2.5.RELEASE/spring-core-4.2.5.RELEASE-sources.jar!/org/springframework/util/AntPathMatcher.java

    /**
     * 实际对给定路径和给定模式进行匹配的方法
     * Actually match the given {@code path} against the given {@code pattern}.
     *
     * @param pattern   the pattern to match against　匹配模式
     * @param path      the path String to test　测试路径字符串
     * @param fullMatch whether a full pattern match is required (else a pattern match
     *                  as far as the given base path goes is sufficient)　是否需要全路径模式匹配
     * @return {@code true} if the supplied {@code path} matched, {@code false} if it didn't
     */
    protected boolean doMatch(String pattern, String path, boolean fullMatch, Map<String, String> uriTemplateVariables) {
        if (path.startsWith(this.pathSeparator) != pattern.startsWith(this.pathSeparator)) {
            return false;
        }

        // 根据模式字符串获取模式数组 /com/test/* => [com,test,.*]
        String[] pattDirs = tokenizePattern(pattern);
        // 拆分路径到路径数组　/com/test => [com,test]
        String[] pathDirs = tokenizePath(path);

        int pattIdxStart = 0;
        int pattIdxEnd = pattDirs.length - 1;
        int pathIdxStart = 0;
        int pathIdxEnd = pathDirs.length - 1;
        // 匹配路径和模式的所有元素直到第一个**模式。　从前往后进行匹配
        // Match all elements up to the first **
        while (pattIdxStart <= pattIdxEnd && pathIdxStart <= pathIdxEnd) {
            String pattDir = pattDirs[pattIdxStart];
            if ("**".equals(pattDir)) {
                break;
            }
            if (!matchStrings(pattDir, pathDirs[pathIdxStart], uriTemplateVariables)) {
                return false;
            }
            pattIdxStart++;
            pathIdxStart++;
        }

        // 测试路径已经匹配完
        if (pathIdxStart > pathIdxEnd) {
            // 路径已经匹配完，仅当模式的其余部分为*或**时才匹配
            // Path is exhausted, only match if rest of pattern is * or **'s
            if (pattIdxStart > pattIdxEnd) {
                return (pattern.endsWith(this.pathSeparator) ? path.endsWith(this.pathSeparator) :
                        !path.endsWith(this.pathSeparator));
            }
            // 不需要完全匹配（模式与路径完全匹配），则返回真
            if (!fullMatch) {
                return true;
            }
            // 如果模式匹配完成，并且模式最后以 *和路径分割符结尾，则返回真
            if (pattIdxStart == pattIdxEnd && pattDirs[pattIdxStart].equals("*") && path.endsWith(this.pathSeparator)) {
                return true;
            }
            // 否则轮询模式，判断剩余模式否都是 **
            for (int i = pattIdxStart; i <= pattIdxEnd; i++) {
                if (!pattDirs[i].equals("**")) {
                    return false;
                }
            }
            return true;
        }
        // 测试路径未匹配完但模式完了，则返回失败
        else if (pattIdxStart > pattIdxEnd) {
            // String not exhausted, but pattern is. Failure.
            return false;
        }
        // 不需要完全匹配，并且匹配模式最后是**，则返回真
        else if (!fullMatch && "**".equals(pattDirs[pattIdxStart])) {
            // Path start definitely matches due to "**" part in pattern.
            return true;
        }
        // 当模式尚未匹配完成并且带匹配路径也未完成,从后往前进行匹配
        // up to last '**'
        while (pattIdxStart <= pattIdxEnd && pathIdxStart <= pathIdxEnd) {
            String pattDir = pattDirs[pattIdxEnd];
            // 如果当前模式是**则跳过
            if (pattDir.equals("**")) {
                break;
            }
            if (!matchStrings(pattDir, pathDirs[pathIdxEnd], uriTemplateVariables)) {
                return false;
            }
            pattIdxEnd--;
            pathIdxEnd--;
        }
        // 匹配路径当前头索引大于尾索引时，如果头尾索引之间的匹配路径均是**时返回真
        if (pathIdxStart > pathIdxEnd) {
            // String is exhausted
            for (int i = pattIdxStart; i <= pattIdxEnd; i++) {
                if (!pattDirs[i].equals("**")) {
                    return false;
                }
            }
            return true;
        }
        // 当模式头索引不等于尾索引并且头路径小于当前尾索引时，判断模式头索引到为索引之间的模式是否为**
        while (pattIdxStart != pattIdxEnd && pathIdxStart <= pathIdxEnd) {
            int patIdxTmp = -1;
            for (int i = pattIdxStart + 1; i <= pattIdxEnd; i++) {
                if (pattDirs[i].equals("**")) {
                    patIdxTmp = i;
                    break;
                }
            }
            // 如果模式包含**,则判断下**的位置是否与模式当前头索引位置+1处的模式相同
            if (patIdxTmp == pattIdxStart + 1) {
                // '**/**' situation, so skip one
                pattIdxStart++;
                continue;
            }
            // Find the pattern between padIdxStart & padIdxTmp in str between
            // strIdxStart & strIdxEnd
            int patLength = (patIdxTmp - pattIdxStart - 1);
            int strLength = (pathIdxEnd - pathIdxStart + 1);
            int foundIdx = -1;

            strLoop:
            for (int i = 0; i <= strLength - patLength; i++) {
                for (int j = 0; j < patLength; j++) {
                    String subPat = pattDirs[pattIdxStart + j + 1];
                    String subStr = pathDirs[pathIdxStart + i + j];
                    if (!matchStrings(subPat, subStr, uriTemplateVariables)) {
                        continue strLoop;
                    }
                }
                foundIdx = pathIdxStart + i;
                break;
            }

            if (foundIdx == -1) {
                return false;
            }

            pattIdxStart = patIdxTmp;
            pathIdxStart = foundIdx + patLength;
        }

        for (int i = pattIdxStart; i <= pattIdxEnd; i++) {
            if (!pattDirs[i].equals("**")) {
                return false;
            }
        }

        return true;
    }

其中`AntPathMatcher#matchStrings`调用的是`AntPathMatcher#getStringMatcher`方法，而`getStringMatcher`方法则是缓存并返回路径对的`AntPathMatcher.AntPathStringMatcher`对象。具体的构造函数如下：

    public AntPathStringMatcher(String pattern, boolean caseSensitive) {
        StringBuilder patternBuilder = new StringBuilder();
        Matcher matcher = GLOB_PATTERN.matcher(pattern);
        int end = 0;
        while (matcher.find()) {
            patternBuilder.append(quote(pattern, end, matcher.start()));
            String match = matcher.group();
            if ("?".equals(match)) { //　问号构建成 .
                patternBuilder.append('.');
            } else if ("*".equals(match)) { // 星号构建成 .*
                patternBuilder.append(".*");
            } else if (match.startsWith("{") && match.endsWith("}")) {
                int colonIdx = match.indexOf(':');
                if (colonIdx == -1) {
                    patternBuilder.append(DEFAULT_VARIABLE_PATTERN);
                    this.variableNames.add(matcher.group(1));
                } else {
                    String variablePattern = match.substring(colonIdx + 1, match.length() - 1);
                    patternBuilder.append('(');
                    patternBuilder.append(variablePattern);
                    patternBuilder.append(')');
                    String variableName = match.substring(1, colonIdx);
                    this.variableNames.add(variableName);
                }
            }
            end = matcher.end();
        }
        patternBuilder.append(quote(pattern, end, pattern.length()));
        this.pattern = (caseSensitive ? Pattern.compile(patternBuilder.toString()) :
                Pattern.compile(patternBuilder.toString(), Pattern.CASE_INSENSITIVE));
    }




[^comment]: 这里的处理只是笼统的针对`PathMatchingResourcePatternResolver.java#findPathMatchingResources`方法来讲，因为在调用该方法前，只是简单的将**完全搜索路径**（`classpath*:a/b/*/**.class`）拆成**根路径**（`classpath*:a/b/`）和**待匹配路径**（`*/**.class`），但在将这两个参数传递到该方法时，会将**根路径**前缀去掉。同时在做匹配路径时又会将这两个路径合并起来。因此本质上对于**完全待匹配路径**来说只是简单的把**完全搜索路径**的前缀去掉而已。
