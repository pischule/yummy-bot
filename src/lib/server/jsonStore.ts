export const jsonStore = <Type>(filename: string) => {
  const get = async () => {
    try {
      const file = Bun.file(filename);
      return <Type>await file.json();
    } catch (e) {
      console.error(`failed to read ${filename}`, e);
      return null;
    }
  };

  const set = async (value: Type) => {
    try {
      await Bun.write(filename, JSON.stringify(value));
    } catch (e) {
      console.error(`failed to write ${filename}`, e);
    }
  };

  return {
    get,
    set,
  };
};
