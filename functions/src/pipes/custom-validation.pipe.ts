import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CustomServerError } from '../exceptions/custom-server.exception';
import { logError } from '../utils/logger.util';

@Injectable()
export class CustomValidationPipe implements PipeTransform {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToClass(metatype, value);

    const errors = await validate(object).catch((err) => {
      const errorStr = JSON.stringify(err, Object.getOwnPropertyNames(err));
      logError('Validation error', errorStr);
      throw new CustomServerError({
        message: 'server/validation-failed',
        detailMessage: errorStr,
      });
    });

    if (errors.length > 0) {
      const errorList = errors.map((entry) => ({
        name: entry.property,
        constraints: entry.constraints,
        children: entry.children,
      }));

      logError('Validation error', JSON.stringify(errorList));
      throw new CustomServerError({
        message: 'server/validation-failed',
        detailMessage: errorList,
      });
    }

    return value;
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
