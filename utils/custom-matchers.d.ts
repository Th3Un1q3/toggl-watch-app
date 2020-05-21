declare global {
    namespace jest {
        interface Matchers<R> {
            toBeVisible(): R;
        }
    }
}
