import { Routes } from '@angular/router';
import { TaskListComponent} from './components/task-list/task-list';
import { TaskFormComponent } from './components/task-form/task-form';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', component: TaskListComponent, canActivate: [authGuard] },
  { path: 'add', component: TaskFormComponent, canActivate: [authGuard] },
  { path: 'edit/:id', component: TaskFormComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/' }
];
