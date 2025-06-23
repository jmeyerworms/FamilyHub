import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FamilyMember } from '../models/FamilyMember';

@Injectable({ providedIn: 'root' })
export class FamilyMemberService {
  private familyMembers: FamilyMember[] = [];
  private familyMembersSubject = new BehaviorSubject<FamilyMember[]>([]);

  constructor() {
    // Initialize with empty array - data comes from API
  }

  getAllMembers(): Observable<FamilyMember[]> {
    return this.familyMembersSubject.asObservable();
  }

  getMemberById(id: string): FamilyMember | undefined {
    return this.familyMembers.find((member) => member.id === id);
  }

  addMember(member: FamilyMember): void {
    // Ensure the member has an ID
    if (!member.id) {
      member.id = crypto.randomUUID();
    }

    this.familyMembers.push(member);
    this.notifyUpdates();
  }

  updateMember(updatedMember: FamilyMember): boolean {
    const index = this.familyMembers.findIndex(
      (member) => member.id === updatedMember.id
    );
    if (index !== -1) {
      this.familyMembers[index] = { ...updatedMember };
      this.notifyUpdates();
      return true;
    }
    return false;
  }

  deleteMember(id: string): boolean {
    const initialLength = this.familyMembers.length;
    this.familyMembers = this.familyMembers.filter(
      (member) => member.id !== id
    );

    if (initialLength !== this.familyMembers.length) {
      this.notifyUpdates();
      return true;
    }
    return false;
  }

  // Load members from family service
  setMembers(members: FamilyMember[]): void {
    this.familyMembers = members.map((member) => ({
      id: member.id,
      name: member.name,
      avatar: member.avatar,
    }));
    this.notifyUpdates();
  }

  private notifyUpdates(): void {
    this.familyMembersSubject.next([...this.familyMembers]);
  }
}
