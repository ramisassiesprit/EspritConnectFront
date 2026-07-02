import { TestBed } from '@angular/core/testing';

import { MailingSettingsService } from './mailing-settings.service';

describe('MailingSettingsService', () => {
  let service: MailingSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MailingSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
