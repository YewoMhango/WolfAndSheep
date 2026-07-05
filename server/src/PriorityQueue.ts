/**
 * Generic binary min-heap. The `compare` function defines priority:
 * `compare(a, b) < 0` means `a` has higher priority (comes out first).
 */
export class PriorityQueue<T> {
  private heap: T[] = [];

  constructor(private readonly compare: (a: T, b: T) => number) {}

  get size(): number {
    return this.heap.length;
  }

  peek(): T | undefined {
    return this.heap[0];
  }

  /** Snapshot of all items (unordered). */
  values(): T[] {
    return [...this.heap];
  }

  push(item: T): void {
    this.heap.push(item);
    this.siftUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    const count = this.heap.length;
    if (count === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (count > 1) {
      this.heap[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  /** Remove the first item matching `predicate`. Returns it, or undefined. */
  remove(predicate: (item: T) => boolean): T | undefined {
    const index = this.heap.findIndex(predicate);
    if (index === -1) return undefined;
    const removed = this.heap[index];
    const last = this.heap.pop()!;
    if (index < this.heap.length) {
      this.heap[index] = last;
      // Restore heap property in whichever direction is needed.
      this.siftDown(index);
      this.siftUp(index);
    }
    return removed;
  }

  private siftUp(index: number): void {
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.compare(this.heap[index], this.heap[parent]) < 0) {
        this.swap(index, parent);
        index = parent;
      } else break;
    }
  }

  private siftDown(index: number): void {
    const count = this.heap.length;
    for (;;) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;
      if (left < count && this.compare(this.heap[left], this.heap[smallest]) < 0) smallest = left;
      if (right < count && this.compare(this.heap[right], this.heap[smallest]) < 0) smallest = right;
      if (smallest === index) break;
      this.swap(index, smallest);
      index = smallest;
    }
  }

  private swap(indexA: number, indexB: number): void {
    [this.heap[indexA], this.heap[indexB]] = [this.heap[indexB], this.heap[indexA]];
  }
}
