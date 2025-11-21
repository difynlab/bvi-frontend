import React from 'react';
import ExpertFirmCard from './ExpertFirmCard';
import EmptyPage from '../EmptyPage';
import ExpertFirmsSkeleton from './ExpertFirmsSkeleton';
import '../../styles/components/ExpertFirmsList.scss';

const ExpertFirmsList = ({ 
  firms = [], 
  loading = false, 
  error = null, 
  selectedSpecialization = '', 
  sortOrder = 'asc',
  searchTerm = '',
  onViewMore,
  isAdmin = false
}) => {
  const hasFilters = (selectedSpecialization && selectedSpecialization !== '') || (searchTerm && searchTerm.length >= 3);
  const totalFirmsCount = firms.length;

  // Filter and sort firms
  const filteredAndSortedFirms = React.useMemo(() => {
    if (!Array.isArray(firms) || firms.length === 0) {
      return [];
    }

    let filtered = firms;

    // Filter by specialization
    if (selectedSpecialization && selectedSpecialization !== '') {
      filtered = filtered.filter(firm => firm.specialization === selectedSpecialization);
    }

    // Filter by search term (minimum 3 characters)
    if (searchTerm && searchTerm.length >= 3) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(firm => 
        firm.name.toLowerCase().includes(searchLower)
      );
    }

    // Sort by name
    const sorted = [...filtered].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

    return sorted;
  }, [firms, selectedSpecialization, sortOrder, searchTerm]);

  if (loading) {
    return <ExpertFirmsSkeleton />;
  }

  if (error) {
    return (
      <div className="expert-firms-list expert-firms-list--error">
        <p>Error loading firms: {error}</p>
      </div>
    );
  }

  if (!loading && !error && filteredAndSortedFirms.length === 0) {
    // No firms at all (not filtered)
    if (totalFirmsCount === 0) {
      return (
        <div className="expert-firms-list expert-firms-list--empty">
          <EmptyPage
            isAdmin={isAdmin}
            title={isAdmin ? 'Oops nothing to see here yet!' : 'Oops! No data found.'}
            description={
              isAdmin
                ? <>Looks like you haven't added anything. Go ahead and add<br /> your first item to get started!</>
                : <>Nothing's been added here yet, or there might be a hiccup.<br />Try again or check back later!</>
            }
          />
        </div>
      );
    }
    
    // No results after filtering
    return (
      <div className="expert-firms-list expert-firms-list--empty">
        <EmptyPage
          isAdmin={isAdmin}
          title="Oops! No data found."
          description={<>No member firms match your current filters. Try adjusting your search criteria or specialization filter.</>}
        />
      </div>
    );
  }

  return (
    <div className="expert-firms-list">
      {filteredAndSortedFirms.map((firm, index) => (
        <ExpertFirmCard 
          key={`${firm.name}-${index}`} 
          firm={firm} 
          onViewMore={onViewMore}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
};

export default ExpertFirmsList;

