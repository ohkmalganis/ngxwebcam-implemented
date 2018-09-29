import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PhotosComponent } from './modules/photos/photos.component';

const appRoutes: Routes = [
	{path: '', component: PhotosComponent},
	{path:'photos', component: PhotosComponent},
	{ path: '**', component: PhotosComponent}
];

export const appRoutingProviders: any[] = [];
export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);