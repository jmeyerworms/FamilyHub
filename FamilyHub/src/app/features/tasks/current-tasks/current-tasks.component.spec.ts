import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentTasksComponent } from './current-tasks.component';

describe('CurrentTasksComponent', () => {
  let component: CurrentTasksComponent;
  let fixture: ComponentFixture<CurrentTasksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrentTasksComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CurrentTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
