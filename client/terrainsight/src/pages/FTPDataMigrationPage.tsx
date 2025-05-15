import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import FTPDataMigration from '../components/etl/FTPDataMigration';

const FTPDataMigrationPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <PageHeader
        heading="FTP Data Migration"
        description="Import property data from external FTP servers into your database."
      />
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <FTPDataMigration />
      </div>
    </div>
  );
};

export default FTPDataMigrationPage;