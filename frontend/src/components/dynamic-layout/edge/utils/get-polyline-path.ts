import { ElkPoint } from 'elkjs';

export type PolylinePathProps = {
    source: ElkPoint;
    target: ElkPoint;
    bends: ElkPoint[];
};

const RADIUS = 8;

export const getPolylinePath = (
    { source, target, bends }: PolylinePathProps
): string => {
    const path = startPath();

    path.moveTo(source);
    bends.forEach((bend) => {
        path.lineTo(bend);
    });
    path.lineTo(target);

    return path.toString();
};

type PathItem = {
    letter: string;
    x: number[];
    y: number[];
};

const getPointFromPathItem = (pathItem: PathItem): ElkPoint => ({
    x: pathItem.x[ 0 ],
    y: pathItem.y[ 0 ],
});

const startPath = () => {
    const items: PathItem[] = [];

    const obj = {
        toString: () => {
            const blends = items.flatMap((item, i) => {
                if (i === 0 || i === items.length - 1) {
                    return [ item ];
                }

                const prevItem = items[ i - 1 ];
                const nextItem = items[ i + 1 ];
                if (!prevItem || !nextItem) {
                    return;
                }


                return getBend(
                    getPointFromPathItem(prevItem),
                    getPointFromPathItem(item),
                    getPointFromPathItem(nextItem),
                    RADIUS
                );
            }).filter(Boolean) as PathItem[];

            return blends.map(pt =>
                `${pt.letter} ${pt.x.join(',')} ${pt.y.join(',')}`
            ).join(' ');
        },
        moveTo: ({ x, y }: ElkPoint) => {
            items.push({
                letter: 'M',
                x: [ x ],
                y: [ y ],
            });
            return obj;
        },
        lineTo: ({ x, y }: ElkPoint) => {
            items.push({
                letter: 'L',
                x: [ x ],
                y: [ y ],
            });
            return obj;
        },
    };

    return obj;
};

const getBend = (a: ElkPoint, b: ElkPoint, c: ElkPoint, size: number): PathItem[] => {
    const bendSize = Math.min(distance(a, b) / 2, distance(b, c) / 2, size);
    const { x, y } = b;

    // no bend
    if ((a.x === x && x === c.x) || (a.y === y && y === c.y)) {
        return [ {
            letter: 'L',
            x: [ x ],
            y: [ y ],
        } ];
    }

    // first segment is horizontal
    if (a.y === y) {
        const xDir = a.x < c.x ? -1 : 1;
        const yDir = a.y < c.y ? 1 : -1;
        return [
            {
                letter: 'L',
                x: [ x + bendSize * xDir ],
                y: [ y ],
            },
            {
                letter: 'Q',
                x: [ x, y ],
                y: [ x, y + bendSize * yDir ],
            },
        ];
    }

    const xDir = a.x < c.x ? 1 : -1;
    const yDir = a.y < c.y ? -1 : 1;
    return [
        {
            letter: 'L',
            x: [ x ],
            y: [ y + bendSize * yDir ],
        },
        {
            letter: 'Q',
            x: [ x, y ],
            y: [ x + bendSize * xDir, y ],
        },
    ];
};

const distance = (a: ElkPoint, b: ElkPoint) => Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
