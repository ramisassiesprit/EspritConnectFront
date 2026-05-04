import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoSupportComponent } from './info-support.component';

describe('InfoSupportComponent', () => {
  let component: InfoSupportComponent;
  let fixture: ComponentFixture<InfoSupportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoSupportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfoSupportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
