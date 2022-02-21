import { Model } from 'sequelize-typescript';
import { Includeable } from 'sequelize/types';

export interface DtoMiddlewareReturn {
  as?: string;
  model: typeof Model;
  attributes: string[];
  include?: Includeable[];
}
