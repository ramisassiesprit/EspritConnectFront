import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtsBoardComponent } from './ats-board.component';

describe('AtsBoardComponent', () => {
  let component: AtsBoardComponent;
  let fixture: ComponentFixture<AtsBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtsBoardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AtsBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
