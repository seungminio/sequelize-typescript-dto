import { Attributes, FindOptions } from 'sequelize';

import { UserType } from './index';

import { DefaultDto } from '../DefaultDto';
import { Model } from 'sequelize-typescript';

export interface IArgs<T extends Model> extends FindOptions<T> {
  exportTo: typeof DefaultDto;
  user?: UserType;
  extraArgs?: any;
}

export interface IGetOptionsWithArgs<T extends Model> {
  query: FindOptions<Attributes<T>>;
  exportDto: DefaultDto;
}

export type FindAllResponseWithDto<T> = [T[], DefaultDto];
export type FindAllResponse<T, WithDto = {}> = WithDto extends true ? FindAllResponseWithDto<T> : T[];

export type FindOneResponseWithDto<T> = [T | null, DefaultDto];
export type FindOneResponse<T, WithDto = {}> = WithDto extends true ? FindOneResponseWithDto<T> : T | null;
