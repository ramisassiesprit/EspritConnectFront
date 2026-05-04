import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EtudiantShellComponent } from './etudiant-shell.component';

describe('EtudiantShellComponent', () => {
  let component: EtudiantShellComponent;
  let fixture: ComponentFixture<EtudiantShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EtudiantShellComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EtudiantShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
