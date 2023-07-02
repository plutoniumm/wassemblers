#include <stdlib.h>

extern "C" {
void arc(double x, double y);
void setWidth(int);
void setHeight(int);
void setFillStyle(const char*, size_t);
void fillRect(int x, int y, int w, int h);
void beginPath();
void arc(int x, int y, int radius, float startAngle, float endAngle);
void fill();
}

int main() {
  setWidth(640);
  setHeight(640);
  const char hex[] = "0123456789abcdef";
  char buf[5] = "#008";
  for (int y = 0; y < 16; ++y) {
    for (int x = 0; x < 16; ++x) {
      buf[1] = hex[x];
      buf[2] = hex[y];
      setFillStyle(buf, 5);
      beginPath();
      arc(x * 20 + 10, y * 20 + 10, 9, 0, 2 * 3.1415);
      fill();
    }
  }
}