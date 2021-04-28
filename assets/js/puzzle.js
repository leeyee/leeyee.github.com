class Utils {

    /**
     * 获取指定范围内的随机数
     * @param min
     * @param max
     * @returns {number} r -> [min, max)
     */
    static getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    /**
     * 获取数组的逆序数
     * @param arr
     * @returns {number}
     */
    static getNumberInversions(arr) {
        let t = 0;
        for (let i = 1; i < arr.length; i++) {
            for (let j = 0; j < i; j++) {
                if (arr[j] > arr[i]) {
                    t++;
                }
            }
        }
        return t;
    }


    /**
     * 使用 Knuth Durstenfeld 洗牌算法打乱数组
     * @param arr
     */
    static knuthDurstenfeldShuffle(arr) {
        let len = arr.length;
        while (len > 1) {
            const randomIndex = Utils.getRandomInt(0, len - 1);
            console.log(len, "exchange: ", randomIndex, len - 1);
            [arr[len - 1], arr[randomIndex]] = [arr[randomIndex], arr[len - 1]];
            console.log("[0,", len, "] = ", randomIndex, "-->", arr, "逆序数:", Utils.getNumberInversions(arr));
            --len;
        }
    }

    /**
     * 是否是奇数
     * @param number
     * @returns {boolean}
     */
    static isOdd(number) {
        return number % 2 !== 0;
    }
}

class Point {
    constructor(x, y) {
        this.X = x;
        this.Y = y;
    }
}

class Puzzle {

    constructor(customProps) {

        const props = {
            W: 140,
            MATRIX_N: 3,
        };

        this.props = {...props, ...customProps};

        this.cPoint = new Point(this.props.W / 2, this.props.W / 2);

        this.numbers = this.getSolvablePuzzleNumbers();
    }

    /**
     * 获取有解数列
     * @returns {*[]}
     */
    getSolvablePuzzleNumbers() {
        let arr = Array.from(new Array(Math.pow(this.props.MATRIX_N, 2) - 1), (val, index) => index + 1);

        Utils.knuthDurstenfeldShuffle(arr);

        if (Utils.isOdd(this.props.MATRIX_N)) {
            [arr[3], arr[1]] = [arr[1], arr[3]];
        }

        return [...arr, 'N'];
    }

    getIndex(number) {
        return this.numbers.findIndex(v => {
            return v === number;
        });
    }

    getOffset(number) {
        const index = this.getIndex(number);
        const row = Math.floor(index / this.props.MATRIX_N);
        const col = index % this.props.MATRIX_N;
        return {R: row, C: col};
    }

    getPoint(number) {
        const offset = this.getOffset(number);
        const x = this.cPoint.X + offset.C * this.props.W;
        const y = this.cPoint.Y + offset.R * this.props.W;
        return new Point(x, y);
    }
}

class PuzzleGame {

    constructor(canvas, puzzle, customProps) {
        const props = {};

        this.canvas = canvas;
        this.puzzle = puzzle;
        this.props = {...props, customProps};
    }

    _canExchange(number) {
        const nullOffset = this.puzzle.getOffset('N');

        const numberOffset = this.puzzle.getOffset(number);

        return nullOffset.R === numberOffset.R && Math.abs(nullOffset.C - numberOffset.C) === 1 ||
            nullOffset.C === numberOffset.C && Math.abs(nullOffset.R - numberOffset.R) === 1;

    }

    doExchange(number) {
        if (!this._canExchange(number)) {
            return;
        }

        const nullIndex = this.puzzle.getIndex('N');
        const numberIndex = this.puzzle.getIndex(number);

        this.puzzle.numbers[nullIndex] = number;
        this.puzzle.numbers[numberIndex] = 'N';

        const nullPoint = this.puzzle.getPoint('N');
        const numberPoint = this.puzzle.getPoint(number);

        this.canvas.setLayerGroup(`group#${number}`, {
            x: numberPoint.X,
            y: numberPoint.Y,
        });
        this.canvas.setLayerGroup(`group#N`, {
            x: nullPoint.X,
            y: nullPoint.Y,
        });

        this.canvas.drawLayers({
            complete: () => {
                this.doJudgment();
            }
        });
    }

    doJudgment() {
        const len = Math.pow(this.puzzle.props.MATRIX_N, 2);
        if (this.puzzle.numbers.includes('N', -1)) {
            let isCompleted = true;
            let baseNumber = this.puzzle.numbers[0];
            for (let i = 1; i < len - 1; i++) {
                if (this.puzzle.numbers[i] - baseNumber !== 1) {
                    isCompleted = false;
                    break;
                } else {
                    baseNumber = this.puzzle.numbers[i];
                }
            }
            if (isCompleted) {
                this.renderCompleted('Congratulations!');
            }
        }
    }

    render() {
        this.puzzle.numbers.map(number => {

            const nPoint = this.puzzle.getPoint(number);

            this.canvas.drawRect({
                data: {number: number},
                layer: true,
                name: `name#${number}`,
                groups: [`group#${number}`],
                x: nPoint.X,
                y: nPoint.Y,
                strokeStyle: 'red',
                strokeWidth: 1,
                fillStyle: () => {
                    return number === 'N' ? '#FFF' : '#FFF';
                },
                width: this.puzzle.props.W,
                height: this.puzzle.props.W,
                click: (layer) => {
                    console.log('click layer: ', layer);
                    this.doExchange(layer.data.number);
                },
                touchend: (layer) => {
                    this.doExchange(layer.data.number);
                },
            });

            if (number !== 'N') {
                this.canvas.drawText({
                    layer: true,
                    name: `label#${number}`,
                    fillStyle: '#36c',
                    x: nPoint.X,
                    y: nPoint.Y,
                    fontSize: 48,
                    fontFamily: 'Verdana, sans-serif',
                    text: number,
                    groups: [`group#${number}`],
                });
            }

        });
    }

    renderCompleted(text) {
        const x = this.puzzle.props.W * this.puzzle.props.MATRIX_N / 2;
        const cPoint = new Point(x, x);
        this.canvas.drawRect({
            layer: true,
            fillStyle: 'gray',
            x: 0,
            y: 0,
            width: this.puzzle.props.W * this.puzzle.props.MATRIX_N,
            height: this.puzzle.props.W * this.puzzle.props.MATRIX_N,
            fromCenter: false
        })
            .drawText({
                layer: true,
                text: text,
                fontSize: 48,
                fontFamily: 'Verdana, sans-serif',
                fillStyle: '#36c',
                x: cPoint.X,
                y: cPoint.Y,
            });
    }

    clearCanvas() {
        let layerNames = [];
        this.canvas.getLayers(layer => {
            layerNames.push(layer.name);
        })
        layerNames.map(name => {
            this.canvas.removeLayer(name);
        })
        this.canvas.drawLayers();
    }
}