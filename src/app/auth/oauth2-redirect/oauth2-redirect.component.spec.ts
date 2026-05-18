import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Oauth2RedirectComponent } from './oauth2-redirect.component';

describe('Oauth2RedirectComponent', () => {
  let component: Oauth2RedirectComponent;
  let fixture: ComponentFixture<Oauth2RedirectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Oauth2RedirectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Oauth2RedirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
