/* tslint: disable */
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { FormioAppConfig, FormioModule } from '../dist';
import { FormioAuth, FormioAuthConfig, FormioAuthService } from '../dist/auth';
import { FormioGrid } from '../dist/grid';
import { AppConfig } from './config';
import { FormioFormsModule } from './forms';
import { FormioDemoComponent } from './demo.component';
import { AuthDemoModule } from './auth/auth.module';
import { HomeComponent } from './home.component';
import { DataComponent } from './data.component';
import { EventModule } from './event/event.module';

@NgModule({
  declarations: [
    FormioDemoComponent,
    HomeComponent,
    DataComponent
  ],
  imports: [
    BrowserModule,
    FormioModule,
    FormioAuth,
    FormioGrid,
    RouterModule.forRoot([
      {
        path: '',
        component: HomeComponent
      },
      {
        path: 'data',
        component: DataComponent
      },
      {
        path: 'forms',
        loadChildren: () => FormioFormsModule
      },
      {
        path: 'auth',
        loadChildren: () => AuthDemoModule
      },
      {
        path: 'event',
        loadChildren: () => EventModule
      }
    ])
  ],
  providers: [
    FormioAuthService,
    {provide: FormioAppConfig, useValue: AppConfig},
    {provide: FormioAuthConfig, useValue: {
      login: {
        form: 'user/login'
      },
      register: {
        form: 'user/register'
      }
    }}
  ],
  bootstrap: [FormioDemoComponent]
})
export class DemoModule {}
/* tslint: enable */
