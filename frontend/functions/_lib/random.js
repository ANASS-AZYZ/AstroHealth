// CPython random.Random integer seeding and MT19937 random() for reference parity.
export class PythonRandom {
  constructor(seed = 2026, saved) {
    if (saved) { this.mt = saved.mt; this.index = saved.index; return; }
    this.mt = Array(624); this.mt[0] = 19650218;
    for (let i = 1; i < 624; i++) this.mt[i] = (Math.imul(1812433253, this.mt[i-1] ^ (this.mt[i-1] >>> 30)) + i) >>> 0;
    const key = [Math.abs(seed) >>> 0];
    let i = 1, j = 0;
    for (let k = 624; k; k--) {
      this.mt[i] = ((this.mt[i] ^ Math.imul(this.mt[i-1] ^ (this.mt[i-1] >>> 30), 1664525)) + key[j] + j) >>> 0;
      if (++i >= 624) { this.mt[0] = this.mt[623]; i = 1; }
      if (++j >= key.length) j = 0;
    }
    for (let k = 623; k; k--) {
      this.mt[i] = ((this.mt[i] ^ Math.imul(this.mt[i-1] ^ (this.mt[i-1] >>> 30), 1566083941)) - i) >>> 0;
      if (++i >= 624) { this.mt[0] = this.mt[623]; i = 1; }
    }
    this.mt[0] = 0x80000000; this.index = 624;
  }
  word() {
    if (this.index >= 624) {
      for (let i = 0; i < 624; i++) {
        const y = (this.mt[i] & 0x80000000) | (this.mt[(i+1)%624] & 0x7fffffff);
        this.mt[i] = (this.mt[(i+397)%624] ^ (y >>> 1) ^ ((y & 1) ? 0x9908b0df : 0)) >>> 0;
      }
      this.index = 0;
    }
    let y = this.mt[this.index++]; y ^= y >>> 11; y ^= (y << 7) & 0x9d2c5680; y ^= (y << 15) & 0xefc60000; y ^= y >>> 18;
    return y >>> 0;
  }
  uniform(a,b) { return a + (b-a) * ((this.word() >>> 5) * 67108864 + (this.word() >>> 6)) / 9007199254740992; }
  save() { return { mt: this.mt, index: this.index }; }
}
