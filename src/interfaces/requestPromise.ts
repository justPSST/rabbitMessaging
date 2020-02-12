export interface IRequestPromise {
  [key: string]: {
    resolve: (body: any) => void;
    reject: (body: any) => void;
  };
}
