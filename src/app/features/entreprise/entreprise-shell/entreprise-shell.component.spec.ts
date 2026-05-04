import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntrepriseShellComponent } from './entreprise-shell.component';

describe('EntrepriseShellComponent', () => {
  let component: EntrepriseShellComponent;
  let fixture: ComponentFixture<EntrepriseShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntrepriseShellComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntrepriseShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
