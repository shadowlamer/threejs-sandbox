varying vec2 vUv;
uniform float time;

float PI = 3.14159265;

float cnoise(float x, float y, float time) {
    float result;
    result = sin((x + time) * 2.0 * PI) * sin((y + time) * 2.0 * PI);
    return result;
}

void main() {
    float cx = abs(0.5 - vUv.x) * 2.0;
    float cy = abs(0.5 - vUv.y) * 2.0;

    float red = cnoise(cx, cy, sin(time / 20.0));
    float green = cnoise(cx, cy, sin(time / 10.0));
    float blue = cnoise(cx, cy, sin(time / 5.0));

    gl_FragColor = vec4(red, green, blue, 0.2);
}
