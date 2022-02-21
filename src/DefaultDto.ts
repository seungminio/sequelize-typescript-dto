import { DataType } from 'sequelize-typescript';
import { literal } from 'sequelize';
import { DtoMiddlewareReturn } from './types/Dto';
import { UserType } from './types';

export class DefaultDto {
  public id?: number;

  public version?: number | any;

  private fixValue = (type: any, value: any) => {
    switch (type) {
      case DataType.INTEGER:
        if (value === undefined || value === null) return value;
        return parseInt(String(value), 10);
      case DataType.FLOAT:
        if (value === undefined || value === null) return value;
        return parseFloat(String(value));
      case DataType.ARRAY:
        return value;
      case DataType.STRING:
        if (value === undefined || value === null) return value;
        return String(value);
      case DataType.BOOLEAN:
        return !!value;
      default:
        return value;
    }
  };

  public map = (data: any): any => {
    const attributesOptions = Reflect.getMetadata('sequelize:attributes', this);
    const connectOptions = Reflect.getMetadata('sequelize::dtoTypes', this);
    const queryOptions = Reflect.getMetadata('sequelize::queryTypes', this);

    const properties = { ...attributesOptions };

    if (queryOptions) {
      Object.keys(queryOptions).forEach((key) => {
        properties[key] = { type: queryOptions[key].data.type };
      });
    }

    if (connectOptions) {
      Object.keys(connectOptions).forEach((key) => {
        properties[key] = connectOptions[key];
      });
    }

    const dataValues: any = data?.dataValues || data;

    const isArray = Array.isArray(dataValues);

    if (isArray) {
      return dataValues.map((item: any) => this.map(item));
    }

    return Object.keys(properties).reduce((p: { [key: string]: unknown }, key) => {
      const property = properties[key];

      if (properties[key].type === 'dto') {
        p[key] = new property.ConnectDto().map(dataValues?.[key]);
      } else {
        p[key] = this.fixValue(property.type, dataValues?.[key]);
      }

      return p;
    }, {});
  };

  public middleware = (as?: string, user?: UserType, extraAs?: string[]) => {
    const modelInfo = Reflect.getMetadata('sequelize::dtoInfo', this);
    const attributesOptions = Reflect.getMetadata('sequelize:attributes', this);
    const connectOptions = Reflect.getMetadata('sequelize::dtoTypes', this);
    const queryOptions = Reflect.getMetadata('sequelize::queryTypes', this);

    const extraAsData: string[] = extraAs ? ([...extraAs, as].filter((v) => !!v) as string[]) : as ? [as] : [];

    const attributes: string[] = ['id'];

    if (attributesOptions) {
      Object.keys(attributesOptions).forEach((key) => attributes.push(key));
    }

    const include: any = [];

    if (connectOptions) {
      Object.keys(connectOptions).forEach((key) => {
        const { ConnectDto } = connectOptions[key];
        include.push(new ConnectDto().middleware(connectOptions[key].as, user, extraAsData));
      });
    }

    if (queryOptions) {
      Object.keys(queryOptions).forEach((key) => {
        const queryData = queryOptions[key];
        (attributes as any).push([
          literal(
            queryData.data.query({
              association:
                extraAsData.length >= 2 ? '`' + `${extraAsData.join('->')}` + '`' : as || modelInfo.defineTable.name,
              user,
            }),
          ),
          queryData.data.as,
        ]);
      });
    }

    if (modelInfo.timestamps) {
      attributes.push('created_at');
      attributes.push('updated_at');
    }

    const result: DtoMiddlewareReturn = {
      model: modelInfo.defineTable,
      attributes,
    };

    if (as) result.as = as;

    if (include.length > 0) result.include = include;

    return result;
  };
}
