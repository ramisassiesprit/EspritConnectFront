import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtsCardComponent } from './ats-card.component';

describe('AtsCardComponent', () => {
  let component: AtsCardComponent;
  let fixture: ComponentFixture<AtsCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtsCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AtsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
