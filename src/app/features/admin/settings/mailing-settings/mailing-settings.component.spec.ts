import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MailingSettingsComponent } from './mailing-settings.component';

describe('MailingSettingsComponent', () => {
  let component: MailingSettingsComponent;
  let fixture: ComponentFixture<MailingSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MailingSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MailingSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
