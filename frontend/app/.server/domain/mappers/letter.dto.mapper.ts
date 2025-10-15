import type { LetterDto } from '~/.server/domain/dtos/letter.dto';
import type { LetterEntity, PdfEntity } from '~/.server/domain/entities/letter.entity';

export interface LetterDtoMapper {
  mapLetterEntitiesToLetterDtos(letterEntities: readonly LetterEntity[]): readonly LetterDto[];
  mapPdfEntityToString(pdfEntity: PdfEntity): string;
}

export function getLetterDtoMapper(): LetterDtoMapper {
  return new DefaultLetterDtoMapper();
}

export class DefaultLetterDtoMapper implements LetterDtoMapper {
  mapLetterEntitiesToLetterDtos(letterEntities: readonly LetterEntity[]): readonly LetterDto[] {
    return letterEntities.map((letterEntity) => this.mapLetterEntityToLetterDto(letterEntity));
  }

  private mapLetterEntityToLetterDto(letterEntity: LetterEntity): LetterDto {
    return {
      id: letterEntity.LetterId,
      date: letterEntity.LetterDate,
      letterTypeId: letterEntity.LetterName,
    };
  }

  mapPdfEntityToString(pdfEntity: PdfEntity): string {
    return pdfEntity.documentBytes;
  }
}
