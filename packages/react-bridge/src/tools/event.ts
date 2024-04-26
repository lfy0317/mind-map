/**
 * 但在实际应用中需要区分用户的意图：是单纯地点击还是拖拽。正确地判定这两种行为对提供良好的用户体验非常重要。
 */
export class ClickEventCenter {
  nodeDom: HTMLElement;
  isDragging: boolean = false;
  startX: number = 0;
  startY: number = 0;
  threshold: number = 5; // 拖拽阈值，可根据需要调整
  handler?: (e: MouseEvent) => void;

  mousedownHandler = (e) => {
    this.startX = e.pageX;
    this.startY = e.pageY;
    this.isDragging = false;
  }

  mousemoveHandler = (e) => {
    if (Math.abs(e.pageX - this.startX) > this.threshold || Math.abs(e.pageY - this.startY) > this.threshold) {
      this.isDragging = true;
    }
  }

  mouseupHandler = (e) => {
    console.log('@@@@@44444')
    if (this.isDragging) {
      console.log('isDragging')
    } else {
      console.log('click')
      this.handler?.(e);
    }
    // 重置
    this.isDragging = false;
  }

  constructor(nodeDom: HTMLElement) {
    this.nodeDom = nodeDom;
  }

  addClickListener(handler) {
    this.handler = handler;
    this.nodeDom.addEventListener('mousedown', this.mousedownHandler);
    this.nodeDom.addEventListener('mousemove', this.mousemoveHandler);
    this.nodeDom.addEventListener('mouseup', this.mouseupHandler);
  }

  removeClickListener() {
    this.handler = undefined;
    this.nodeDom.removeEventListener('mousedown', this.mousedownHandler);
    this.nodeDom.removeEventListener('mousemove', this.mousemoveHandler);
    this.nodeDom.removeEventListener('mouseup', this.mouseupHandler);
  }
}
