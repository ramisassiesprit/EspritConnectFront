import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AncienShellComponent } from './ancien-shell.component';

describe('AncienShellComponent', () => {
  let component: AncienShellComponent;
  let fixture: ComponentFixture<AncienShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AncienShellComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AncienShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
