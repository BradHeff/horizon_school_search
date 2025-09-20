import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  category: string;
  roles: ('student' | 'staff' | 'admin' | 'guest')[];
  description?: string;
}

interface LinksState {
  quickLinks: QuickLink[];
  filteredLinks: QuickLink[];
}

const defaultLinks: QuickLink[] = [
  {
    id: '1',
    title: 'PowerSchool',
    url: 'https://powerschool.example.com',
    icon: 'School',
    category: 'Academic',
    roles: ['student', 'staff', 'admin'],
    description: 'Student information system'
  },
  {
    id: '2',
    title: 'Canvas LMS',
    url: 'https://canvas.example.com',
    icon: 'LibraryBooks',
    category: 'Learning',
    roles: ['student', 'staff', 'admin'],
    description: 'Learning management system'
  },
  {
    id: '3',
    title: 'Office 365',
    url: 'https://office365.example.com',
    icon: 'Work',
    category: 'Productivity',
    roles: ['student', 'staff', 'admin'],
    description: 'Microsoft Office suite'
  },
  {
    id: '4',
    title: 'Library Catalog',
    url: 'https://library.example.com',
    icon: 'LocalLibrary',
    category: 'Resources',
    roles: ['student', 'staff', 'admin', 'guest'],
    description: 'Search library resources'
  },
  {
    id: '5',
    title: 'Staff Portal',
    url: 'https://staff.example.com',
    icon: 'SupervisorAccount',
    category: 'Staff',
    roles: ['staff', 'admin'],
    description: 'Staff resources and tools'
  },
  {
    id: '6',
    title: 'Gradebook',
    url: 'https://gradebook.example.com',
    icon: 'Assignment',
    category: 'Academic',
    roles: ['staff', 'admin'],
    description: 'Grade management system'
  },
  {
    id: '7',
    title: 'Student Portal',
    url: 'https://student.example.com',
    icon: 'Person',
    category: 'Student',
    roles: ['student'],
    description: 'Student resources and information'
  },
  {
    id: '8',
    title: 'Calendar',
    url: 'https://calendar.example.com',
    icon: 'Event',
    category: 'General',
    roles: ['student', 'staff', 'admin', 'guest'],
    description: 'School calendar and events'
  }
];

const initialState: LinksState = {
  quickLinks: defaultLinks,
  filteredLinks: defaultLinks,
};

const linksSlice = createSlice({
  name: 'links',
  initialState,
  reducers: {
    setLinks: (state, action: PayloadAction<QuickLink[]>) => {
      state.quickLinks = action.payload;
    },
    filterLinksByRole: (state, action: PayloadAction<'student' | 'staff' | 'admin' | 'guest'>) => {
      const role = action.payload;
      state.filteredLinks = state.quickLinks.filter(link =>
        link.roles.includes(role)
      );
    },
    addLink: (state, action: PayloadAction<QuickLink>) => {
      state.quickLinks.push(action.payload);
    },
    removeLink: (state, action: PayloadAction<string>) => {
      state.quickLinks = state.quickLinks.filter(link => link.id !== action.payload);
      state.filteredLinks = state.filteredLinks.filter(link => link.id !== action.payload);
    },
  },
});

export const { setLinks, filterLinksByRole, addLink, removeLink } = linksSlice.actions;
export default linksSlice.reducer;