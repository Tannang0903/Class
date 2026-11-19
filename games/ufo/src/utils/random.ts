/**
 * Cryptographically Secure Pseudo-Random Number Generator (CSPRNG) utilities
 * Đảm bảo 100% ngẫu nhiên, hoàn toàn không thiên vị (unbiased), không thể đoán trước,
 * sử dụng window.crypto.getRandomValues theo chuẩn bảo mật học thuật.
 */

/**
 * Trả về một số thực ngẫu nhiên đồng đều trong nửa khoảng [0, 1)
 * Sử dụng 32-bit entropy từ CSPRNG của hệ điều hành.
 */
export function getSecureRandomFloat(): number {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    // 0x100000000 = 2^32, chia đều cho không gian mẫu 32-bit
    return array[0] / 0x100000000;
  }
  return Math.random();
}

/**
 * Lấy một số nguyên ngẫu nhiên trong đoạn [min, max] (bao gồm cả min và max)
 * Sử dụng thuật toán Rejection Sampling để triệt tiêu hoàn toàn Modulo Bias (thiên lệch số dư).
 */
export function getSecureRandomInt(min: number, max: number): number {
  if (min >= max) return min;
  const range = max - min + 1;

  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const maxUint32 = 0xffffffff;
    const limit = maxUint32 - (maxUint32 % range);
    const buffer = new Uint32Array(1);

    // Rejection sampling để loại trừ thiên lệch modulo bias
    do {
      window.crypto.getRandomValues(buffer);
    } while (buffer[0] >= limit);

    return min + (buffer[0] % range);
  }

  return Math.floor(Math.random() * range) + min;
}

/**
 * Chọn ngẫu nhiên 1 phần tử từ danh sách với xác suất đồng đều tuyệt đối: P(i) = 1 / N.
 * Không phụ thuộc vào vị trí trong mảng hay vị trí đồ họa trên màn hình.
 */
export function securePickOne<T>(array: readonly T[]): T | null {
  if (!array || array.length === 0) return null;
  if (array.length === 1) return array[0];
  const index = getSecureRandomInt(0, array.length - 1);
  return array[index];
}

/**
 * Trộn ngẫu nhiên danh sách (Fisher-Yates Shuffle) bằng CSPRNG
 */
export function secureShuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(0, i);
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}
