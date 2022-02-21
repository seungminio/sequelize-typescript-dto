import { Model, ModelCtor } from 'sequelize-typescript';
import { FindAllResponse, FindOneResponse, IArgs, IGetOptionsWithArgs } from './types/Repository';

export default class Repository {
  private getOptionsWithArgs = <T extends Model>(args: IArgs<T>): IGetOptionsWithArgs<T> => {
    const { exportTo: Dto, user, ...options } = args;
    const exportDto = new Dto();
    const { model: _, ...queryOptions } = exportDto.middleware(undefined, user);
    return { query: { ...queryOptions, ...options }, exportDto };
  };

  private findAll = async <T extends Model>(model: ModelCtor<T>, args: IArgs<T>): Promise<FindAllResponse<T>> => {
    const { query, exportDto } = this.getOptionsWithArgs<T>(args);
    const raws = await model.findAll(query);
    if (!raws) return null;
    return exportDto.map(raws);
  };

  private findOne = async <T extends Model>(model: ModelCtor<T>, args: IArgs<T>): Promise<FindOneResponse<T>> => {
    const { query, exportDto } = this.getOptionsWithArgs<T>(args);
    const raw = await model.findOne(query);
    if (!raw) return null;
    return exportDto.map(raw);
  };

  public repository = {
    findAll: this.findAll,
    findOne: this.findOne,
  };
}
