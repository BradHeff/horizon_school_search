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
  // Student & Guest Links
  {
    id: 'canvas',
    title: 'Canvas',
    url: 'https://canvas.horizon.sa.edu.au',
    icon: 'LibraryBooks',
    category: 'Learning',
    roles: ['student', 'guest'],
    description: 'Learning management system'
  },
  {
    id: 'outlook-student',
    title: 'Outlook',
    url: 'https://outlook.office365.com',
    icon: 'Work',
    category: 'Communication',
    roles: ['student', 'guest'],
    description: 'Microsoft Outlook email'
  },
  {
    id: 'open-access',
    title: 'Open Access Student Links',
    url: 'https://www.openaccess.edu.au/students/student-links',
    icon: 'School',
    category: 'Academic',
    roles: ['student', 'guest'],
    description: 'Open Access College student resources'
  },
  {
    id: 'pat-testing',
    title: 'PAT Testing',
    url: 'https://oars.acer.edu.au/8496',
    icon: 'Assignment',
    category: 'Assessment',
    roles: ['student', 'guest'],
    description: 'Progressive Achievement Testing'
  },

  // Staff Links
  {
    id: 'canvas-staff',
    title: 'Canvas',
    url: 'https://canvas.horizon.sa.edu.au',
    icon: 'LibraryBooks',
    category: 'Learning',
    roles: ['staff'],
    description: 'Learning management system'
  },
  {
    id: 'edupage',
    title: 'Edupage',
    url: 'https://horizoncs.edupage.org/',
    icon: 'School',
    category: 'Administration',
    roles: ['staff'],
    description: 'School management system'
  },
  {
    id: 'tass-admin',
    title: 'TASS Admin',
    url: 'https://horizon.sa.tass.cloud/tassweb/index.cfm',
    icon: 'SupervisorAccount',
    category: 'Administration',
    roles: ['staff'],
    description: 'Student management system'
  },
  {
    id: 'tass-kiosk',
    title: 'TASS Kiosk',
    url: 'https://horizon.sa.tass.cloud/kiosk',
    icon: 'Person',
    category: 'Administration',
    roles: ['staff'],
    description: 'TASS kiosk interface'
  },
  {
    id: 'naplan-admin',
    title: 'Naplan Admin',
    url: 'https://administration.assessform.edu.au/auth/login',
    icon: 'Assignment',
    category: 'Assessment',
    roles: ['staff'],
    description: 'NAPLAN administration portal'
  },
  {
    id: 'google-calendar',
    title: 'Google Calendar',
    url: 'https://calendar.google.com/',
    icon: 'Event',
    category: 'Productivity',
    roles: ['staff'],
    description: 'Google Calendar'
  },
  {
    id: 'outlook-staff',
    title: 'Outlook',
    url: 'https://outlook.office365.com',
    icon: 'Work',
    category: 'Communication',
    roles: ['staff'],
    description: 'Microsoft Outlook email'
  },
  {
    id: 'daybook',
    title: 'Daybook',
    url: 'https://docs.google.com/document/d/1Sgu-3RMNhVYSMuxpoOIR6PlLJXGbs1gcAgxFSVVkgh8/edit',
    icon: 'LibraryBooks',
    category: 'Resources',
    roles: ['staff'],
    description: 'Daily planning document'
  },
  {
    id: 'classwize',
    title: 'Classwize Login',
    url: 'https://classroom.au-1.familyzone.io/login',
    icon: 'SupervisorAccount',
    category: 'Classroom Management',
    roles: ['staff'],
    description: 'Classroom management tool'
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