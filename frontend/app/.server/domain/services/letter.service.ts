import { sort } from 'moderndash';

import type { LetterDto, LettersRequestDto, PdfRequestDto } from '~/.server/domain/dtos/letter.dto';
import type { LetterDtoMapper } from '~/.server/domain/mappers/letter.dto.mapper';
import { getLetterDtoMapper } from '~/.server/domain/mappers/letter.dto.mapper';
import type { LetterRepository } from '~/.server/domain/repositories/letter.repository';
import { getLetterRepository } from '~/.server/domain/repositories/letter.repository';
import type { AuditService } from '~/.server/domain/services/audit.service';
import { getAuditService } from '~/.server/domain/services/audit.service';
import { serverEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';

export interface LetterService {
  /**
   * Find all letters for a given client id.
   *
   * @param lettersRequestDto The letters request dto that includes the client id and user id for auditing
   * @returns A Promise that resolves to all letters found for the client id.
   */
  findLettersBySin(lettersRequestDto: LettersRequestDto): Promise<readonly LetterDto[]>;

  /**
   * Retrieve the PDF for a given letter id.
   *
   * @param pdfRequestDto  The PDF request dto that includes the letter id and user id for auditing
   * @returns A Promise that resolves to the PDF data as a base64-encoded string representing the bytes.
   */
  getPdfByLetterId(pdfRequestDto: PdfRequestDto): Promise<string>;
}

export function getLetterService(): LetterService {
  const mapper = getLetterDtoMapper();
  const auditService = getAuditService();
  const repo = getLetterRepository();
  return new DefaultLetterService(mapper, repo, auditService);
}

export class DefaultLetterService implements LetterService {
  private readonly log;
  private readonly letterDtoMapper: LetterDtoMapper;
  private readonly letterRepository: LetterRepository;
  private readonly auditService: AuditService;

  constructor(letterDtoMapper: LetterDtoMapper, letterRepository: LetterRepository, auditService: AuditService) {
    this.log = LogFactory.getLogger(import.meta.url);
    this.letterDtoMapper = letterDtoMapper;
    this.letterRepository = letterRepository;
    this.auditService = auditService;
    this.init();
  }

  private init(): void {
    this.log.debug('DefaultLetterService initiated.');
  }

  async findLettersBySin({ sin, userId, sortOrder = 'desc' }: LettersRequestDto): Promise<readonly LetterDto[]> {
    this.log.trace('Finding letters with clientId [%s], userId [%s], and sortOrder [%s]', sin, userId, sortOrder);

    this.auditService.createAudit('letters.get', { userId });

    const letterEntities = await this.letterRepository.findLettersBySin(sin, userId);
    const letterDtos = this.letterDtoMapper.mapLetterEntitiesToLetterDtos(letterEntities);
    const sortedLetterDtos = sort(filterLetters(letterDtos), {
      order: sortOrder,
      by: (letterDto) => letterDto.date,
    });

    this.log.trace('Returning letters [%j] for clientId [%s]', sortedLetterDtos, sin);
    return sortedLetterDtos;
  }

  async getPdfByLetterId({ letterId, userId }: PdfRequestDto): Promise<string> {
    this.log.trace('Finding PDF with letterId [%s] and userId [%s]', letterId, userId);

    this.auditService.createAudit('pdf.get', { letterId, userId });

    const pdfEntity = await this.letterRepository.getPdfByLetterId(letterId, userId);
    const pdf = this.letterDtoMapper.mapPdfEntityToString(pdfEntity);

    this.log.trace('Returning pdf [%s] for letterId [%s]', pdf, letterId);
    return pdf;
  }
}

function filterLetters(letters: readonly LetterDto[]): readonly LetterDto[] {
  const { CCT_LETTER_FILTER: letterRegex } = serverEnvironment;
  return letters.filter((l) => {
    return RegExp(letterRegex).exec(l.letterTypeId.toLowerCase());
  });
}
