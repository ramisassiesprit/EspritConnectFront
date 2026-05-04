import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnseignantShellComponent } from './enseignant-shell.component';

describe('EnseignantShellComponent', () => {
  let component: EnseignantShellComponent;
  let fixture: ComponentFixture<EnseignantShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnseignantShellComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnseignantShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
