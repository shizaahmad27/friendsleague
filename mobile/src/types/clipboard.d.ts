declare module '@react-native-clipboard/clipboard' {
  export default {
    setString: (text: string) => Promise<void>;
    getString: () => Promise<string>;
  };
}
