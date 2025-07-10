import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IEntry } from '../../core/interfaces/entry.interface';
import { AuthService } from '../../core/services/auth.service';
import { IUser } from '../../core/interfaces/auth.interface';
import { EntryService } from '../../core/services/entry.service';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-entry',
  imports: [ReactiveFormsModule],
  templateUrl: './entry.component.html',
  styleUrl: './entry.component.css',
})
export class EntryComponent implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private entryService = inject(EntryService);

  protected entryForm!: FormGroup;
  protected selectedImages: string[] = []; // To store image URLs or file names
  private currentUser: IUser | null = this.authService.getCurrentUser();

  ngOnInit(): void {
    this.entryForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      commonNames: [''],
      species: [''],
      clasification: [''],
      alignment: [''],
      threatLevel: [0, [Validators.min(0), Validators.max(10)]],
      longevity: [''],
      content: ['', Validators.required],
      tags: [''],
    });
  }

  protected goToUrl(url: string): void {
    if (url != null && url.length > 0) {
      this.router.navigateByUrl(url);
    }
  }

  protected onSubmit(): void {
    if (this.entryForm.valid) {
      const formData = this.entryForm.value;
      const newEntry: IEntry = {
        id: uuidv4(), // Generate a unique ID
        name: formData.name,
        description: formData.description,
        commonNames: formData.commonNames ? formData.commonNames.split(',').map((s: string) => s.trim()) : [],
        species: formData.species,
        clasification: formData.clasification ? formData.clasification.split(',').map((s: string) => s.trim()) : [],
        alignment: formData.alignment,
        threatLevel: formData.threatLevel,
        longevity: formData.longevity,
        content: formData.content,
        tags: formData.tags ? formData.tags.split(',').map((s: string) => s.trim()) : [],
        images: this.selectedImages,
        author: this.currentUser!,
        date: new Date(),
      };
      this.entryService.createEntry(newEntry).then(() => {
        console.log('Entry created successfully!');
        this.entryForm.reset();
        this.selectedImages = [];
      }).catch(error => {
        console.error('Error creating entry:', error);
      });
    } else {
      console.log('Form is invalid');
      this.entryForm.markAllAsTouched();
    }
  }

  protected onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList) {
      this.selectedImages = [];
      for (let i = 0; i < fileList.length; i++) {
        this.selectedImages.push(fileList[i].name);
      }
      console.log('Selected images:', this.selectedImages);
    }
  }
}

