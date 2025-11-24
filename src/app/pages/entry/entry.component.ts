import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private entryService = inject(EntryService);

  protected entryForm!: FormGroup;
  protected selectedImages: string[] = []; // To store image URLs or file names
  private currentUser: IUser | null = this.authService.getCurrentUser();
  private entryId: string | null = null;
  protected isEditMode = signal(false);

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

    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.entryId = id;
        this.isEditMode.set(true);
        this.loadEntry(id);
      }
    });
  }

  private loadEntry(id: string): void {
    this.entryService.getEntryById(id).subscribe({
      next: (entry) => {
        this.entryForm.patchValue({
          name: entry.name,
          description: entry.description,
          commonNames: entry.commonNames?.join(', ') || '',
          species: entry.species,
          clasification: entry.clasification?.join(', ') || '',
          alignment: entry.alignment,
          threatLevel: entry.threatLevel,
          longevity: entry.longevity,
          content: entry.content,
          tags: entry.tags?.join(', ') || '',
        });
        this.selectedImages = entry.images || [];
      },
      error: (err) => {
        console.error('Error loading entry:', err);
        alert('Error al cargar la entrada');
      }
    });
  }

  protected goToUrl(url: string): void {
    if (url != null && url.length > 0) {
      this.router.navigateByUrl(url);
    }
  }

  protected goToDashboard(): void {
    this.router.navigateByUrl('/dashboard');
  }

  protected onSubmit(): void {
    if (this.entryForm.valid) {
      const formData = this.entryForm.value;

      if (this.isEditMode() && this.entryId) {
        // Update existing entry
        const updatedEntry: IEntry = {
          id: this.entryId,
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

        this.entryService.updateEntry(updatedEntry).then(() => {
          console.log('Entry updated successfully!');
          alert('Entrada actualizada exitosamente');
          this.router.navigateByUrl('/dashboard');
        }).catch(error => {
          console.error('Error updating entry:', error);
          alert('Error al actualizar la entrada');
        });
      } else {
        // Create new entry
        const newEntry: IEntry = {
          id: uuidv4(),
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
          alert('Entrada creada exitosamente');
          this.router.navigateByUrl('/dashboard');
        }).catch(error => {
          console.error('Error creating entry:', error);
          alert('Error al crear la entrada');
        });
      }
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

