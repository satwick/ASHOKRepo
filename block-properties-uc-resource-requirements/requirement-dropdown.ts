import { BehaviorSubject } from 'rxjs';
import DropdownObject from 'app/core/models/dropdown-object.model';

export class RequirementDropdown {
  subject: BehaviorSubject<DropdownObject>;
  initialDropdownObject: DropdownObject = {
    name: '',
    label: '',
    code: '',
  };
  options: DropdownObject[] = [];
  selectedDropdownObject?: DropdownObject;

  constructor() {
    this.subject = new BehaviorSubject<DropdownObject>(
      this.initialDropdownObject
    );
  }

  set initialValueName(value: string) {
    this.initialDropdownObject = {
      name: value,
      code: value,
      label: value,
    };
    this.subject.next(this.initialDropdownObject);
    if (!this.options.includes(this.initialDropdownObject)) {
      this.options.unshift(this.initialDropdownObject);
    }
  }

  updateRequirement(
    code: string | undefined,
    selectedOption?: DropdownObject
  ): void {
    const newValue: DropdownObject = {
      code: code || selectedOption?.code || '',
      label: code || selectedOption?.label || '',
      name: code || selectedOption?.name || '',
    };
    this.selectedDropdownObject = newValue;

    this.subject.next(newValue);
  }

  resetSubjectToInitialValue(): void {
    this.subject.next(this.initialDropdownObject);
  }

  addOptions(options: string[]): void {
    this.options = options
      .map((nameOption) => {
        return { label: nameOption, name: nameOption, code: nameOption };
      })
      .sort((option1, option2) => option1.label.localeCompare(option2.label));
  }

  isModified(): boolean {
    return (
      this.subject.getValue().name !== this.initialDropdownObject.name &&
      (this.subject.getValue().name !== '' ||
        this.initialDropdownObject.name !== undefined)
    );
  }
}
