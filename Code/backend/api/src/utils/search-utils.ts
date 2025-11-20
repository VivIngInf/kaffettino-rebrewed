export const TAKE_GLOBAL = 20;

export interface ISearchParams {
  take?: number;
  skip?: number;
  lte?: number | Date;
  gte?: number | Date;
}

export interface IPagination {
  page?: number;
  limit?: number;
}

export interface IRangeSearch {
  range: {
    min: number;
    max: number;
  };
}
