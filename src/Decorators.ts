import { Model, TableOptions, addOptions } from 'sequelize-typescript';
import { AbstractDataTypeConstructor } from 'sequelize';
import { UserType } from './types';

export function Dto(info: { timestamps?: boolean; tableName: string; defineTable: typeof Model }) {
  return function annotate(target: any, options: TableOptions = {}): void {
    const args = {
      ...info,
      timestamps: info.timestamps === undefined,
    };
    Reflect.defineMetadata('sequelize::dtoInfo', args, target.prototype);
    addOptions(target.prototype, options);
  };
}

const getAttributes = (target: any, key: string) => {
  let attributes = Reflect.getMetadata(key, target);

  if (attributes) {
    return Object.keys(attributes).reduce((copy: any, key: any) => {
      copy[key] = { ...attributes[key] };

      return copy;
    }, {});
  }

  if (!attributes) {
    attributes = {};
  }

  return attributes;
};

const getDtoTypes = (target: any) => getAttributes(target, 'sequelize::dtoTypes');
const getDtoQueries = (target: any) => getAttributes(target, 'sequelize::queryTypes');

export function DtoType(ConnectTo: any, as: string) {
  return (target: any, propertyName: string, propertyDescriptor?: PropertyDescriptor) => {
    const attributes = getDtoTypes(target);

    const ConnectDto = ConnectTo();

    const swaggerExampleData = new ConnectDto().swagger(as);

    const options = {
      type: 'dto',
      as,
      ConnectDto,
      example: swaggerExampleData,
    };

    attributes[propertyName] = { ...options };

    Reflect.defineMetadata('sequelize::dtoTypes', { ...attributes }, target);
  };
}

interface QueryParams {
  user?: UserType;
  association?: string;
}

interface DtoQueryParams {
  query: (props: QueryParams) => string;
  type?: AbstractDataTypeConstructor;
  example?: any;
}

export function DtoQuery({ query, type, example }: DtoQueryParams) {
  return (target: any, propertyName: string, propertyDescriptor?: PropertyDescriptor) => {
    const queries = getDtoQueries(target);

    queries[propertyName] = {
      type: 'query',
      data: {
        as: propertyName,
        query: (props: QueryParams) => query(props),
        type,
      },
      example,
    };

    Reflect.defineMetadata('sequelize::queryTypes', { ...queries }, target);
  };
}
