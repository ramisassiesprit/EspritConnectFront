import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TalentInsightsComponent } from './talent-insights.component';

describe('TalentInsightsComponent', () => {
  let component: TalentInsightsComponent;
  let fixture: ComponentFixture<TalentInsightsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TalentInsightsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TalentInsightsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
