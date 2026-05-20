import * as migration_20260409_155734_initial from './20260409_155734_initial';
import * as migration_20260520_203637_custom_admin_schema from './20260520_203637_custom_admin_schema';

export const migrations = [
  {
    up: migration_20260409_155734_initial.up,
    down: migration_20260409_155734_initial.down,
    name: '20260409_155734_initial',
  },
  {
    up: migration_20260520_203637_custom_admin_schema.up,
    down: migration_20260520_203637_custom_admin_schema.down,
    name: '20260520_203637_custom_admin_schema'
  },
];
