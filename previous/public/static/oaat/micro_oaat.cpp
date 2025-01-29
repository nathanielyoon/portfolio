#include <cstdint>
#include <string>
#include <iostream>

#define GROL(x,n) (((x)<<(n))|((x)>>(32-(n))))

void MicroOAAT(const void *key, int len, uint32_t seed) {
  unsigned char *str = (unsigned char *)key;
  const unsigned char *const end = (const unsigned char *)str + len;
  uint32_t h1 = seed ^ 0x3b00;
  uint32_t h2 = GROL(seed, 15);
  for (;str != end; str++) {
    h1 += str[0];
    h1 += h1 << 3;
    h2 -= h1;
    h1 = GROL(h1, 7);
  }
  std::cout << (h1 ^ h2);
}

int main() {
  std::string line;
  getline(std::cin, line);
  MicroOAAT(line.c_str(), line.length(), 0);
  return 0;
}
