export type SettingsSave<Request> = (request: Request) => Promise<void>;

export function createSettingsSaveQueue<Request>(save: SettingsSave<Request>) {
  let tail = Promise.resolve();

  return (request: Request) => {
    const result = tail.then(() => save(request));
    tail = result.catch(() => undefined);
    return result;
  };
}
