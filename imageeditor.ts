namespace tileworld {
    const yoff = 4;
    const colorSize = 8;
    const paintSize = 6;
    const colorsY = 30;
    const colorsX = 5;
    enum CursorType { Color, Paint};
    export class ImageEditor extends BackgroundBase {
        private cursorType: CursorType;         // are we selecting a color or painting?
        private colorCursor: Sprite;
        private paintCursor: Sprite;
        private selectedColor: number;
        private image: Image;    // 16x16
        constructor(private p: Project, private kind: number) {
            super();
            this.cursorType= CursorType.Color;

            this.colorCursor = sprites.create(colorCursor)
            this.colorCursor.x = colorsX  + (colorSize>>1);
            this.colorCursor.y = colorsY + colorSize*8;
            this.selectedColor = 0;
            this.paintCursor = sprites.create(paintCursor)
            this.paintCursor.x = paintSize * 5 + 2 
            this.paintCursor.y = paintSize * 2 + 2
            this.paintCursor.setFlag(SpriteFlag.Invisible, true)
            this.image = p.getImage(kind);
            this.update();

            controller.left.onEvent(ControllerButtonEvent.Pressed, () => this.moveLeft());
            controller.left.onEvent(ControllerButtonEvent.Repeated, () => this.moveLeft());
            controller.right.onEvent(ControllerButtonEvent.Pressed, () => this.moveRight());
            controller.right.onEvent(ControllerButtonEvent.Repeated, () => this.moveRight());
            controller.up.onEvent(ControllerButtonEvent.Pressed, () => this.moveUp());
            controller.up.onEvent(ControllerButtonEvent.Repeated, () => this.moveUp());
            controller.down.onEvent(ControllerButtonEvent.Pressed, () => this.moveDown());
            controller.down.onEvent(ControllerButtonEvent.Repeated, () => this.moveDown());

            controller.A.onEvent(ControllerButtonEvent.Pressed, () => {
                if (this.cursorType== CursorType.Color) {
                    let col = ((this.colorCursor.x - colorsX) / colorSize ) | 0x0
                    let row = ((this.colorCursor.y - (colorSize << 1) - colorsY) / colorSize) | 0x0
                    this.selectedColor = row * 2 + col
                    this.update()
                } else {
                    let col = ((this.paintCursor.x - (paintSize*5 + 2)) / paintSize) | 0x0
                    let row = ((this.paintCursor.y - (paintSize*2 + 2)) / paintSize) | 0x0
                    this.image.setPixel(col, row, this.selectedColor)
                    this.update()
                }
            });
            controller.B.onEvent(ControllerButtonEvent.Pressed, () => {
                if (this.cursorType== CursorType.Paint) {
                    this.setCursor(CursorType.Color);
                } else if (this.cursorType== CursorType.Color) {
                    this.saveAndPop();
                }
            });
        }

        private moveLeft() {
            if (this.cursorType == CursorType.Color) {
                if (this.colorCursor.x > colorsX + colorSize)
                    this.colorCursor.x -= colorSize
            } else {
                if (this.paintCursor.x > paintSize * 6 - 1)
                    this.paintCursor.x -= paintSize
                else {
                    // transition cursor to color editor
                    this.setCursor(CursorType.Color);
                }
            }
        }

        private moveRight() {
            if (this.cursorType == CursorType.Color) {
                if (this.colorCursor.x < colorsX + colorSize)
                    this.colorCursor.x += colorSize
                else {
                    // transition cursor to paint editor
                    this.setCursor(CursorType.Paint);
                }
            } else {
                if (this.paintCursor.x < (paintSize * 5 + 2) + paintSize * 15)
                    this.paintCursor.x += paintSize
            }
        }

        private moveUp() {
            if (this.cursorType == CursorType.Color) {
                if (this.colorCursor.y > colorsY + (colorSize << 1) + (colorSize - 1))
                    this.colorCursor.y -= colorSize;
            } else {
                if (this.paintCursor.y > (paintSize * 3 + 1))
                    this.paintCursor.y -= paintSize
            }
        }

        private moveDown() {
            if (this.cursorType == CursorType.Color) {
                if (this.colorCursor.y < colorsY + (colorSize << 1) + colorSize * (colorSize - 1))
                    this.colorCursor.y += colorSize
            } else {
                if (this.paintCursor.y < (paintSize * 2) + 2 + paintSize * 15)
                    this.paintCursor.y += paintSize
            }
        }

        private saveAndPop() {
            this.p.saveImage(this.kind);
            game.popScene();
        }
        
        private setCursor(ct: CursorType) {
            this.colorCursor.setFlag(SpriteFlag.Invisible, ct != CursorType.Color);
            this.paintCursor.setFlag(SpriteFlag.Invisible, ct != CursorType.Paint);
            this.cursorType= ct;
        }

        public update() {
            screen.fill(0);
            screen.fillRect(colorsX, yoff, 16, 16, 11);
            screen.drawTransparentImage(paint, colorsX, yoff)
            //screen.fill(0)
            // draw the 16 colors
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 2; col++) {
                    let color = row * 2 + col
                    let yOffset = colorsY + colorSize + (colorSize >> 1)
                    screen.fillRect(colorsX + col * colorSize + 1, yOffset + row * colorSize + 1, colorSize-2, colorSize-2, color)
                    if (this.selectedColor == color) {
                        screen.drawRect(colorsX + col * colorSize, yOffset + row * colorSize, colorSize, colorSize, 1)
                    }
                }
            }
            // take care of transparent
            screen.fillRect(colorsX + 1, colorsY+13, 3, 3, 13)
            screen.fillRect(colorsX + 4, colorsY+16, 3, 3, 13)
            // frame the sprite editor
            screen.drawRect(28, 10, paintSize * 16 + (paintSize - 2), paintSize * 16 + (paintSize -2), 1)
            // draw the sprite editor
            for (let row = 0; row < this.image.height; row++) {
                let y = (paintSize << 1) + row * paintSize
                for (let col = 0; col < this.image.width; col++) {
                    let x = paintSize * 5 + col * paintSize
                    let color = this.image.getPixel(col, row)
                    screen.fillRect(x, y, paintSize-1, paintSize-1, color)
                    if (color == 0) {
                        screen.fillRect(x, y, (paintSize >> 1) -1, (paintSize >> 1) -1, 13)
                        screen.fillRect(x + (paintSize >> 1), y + (paintSize >> 1), (paintSize >> 1)-1, (paintSize >> 1)-1, 13)
                    }
                }
            }
            // draw the sprite
            screen.drawImage(this.image, 134, 12)
            screen.drawRect(133, 11, 18, 18, 1)
        }
    }
}