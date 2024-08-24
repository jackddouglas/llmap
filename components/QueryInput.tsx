import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';

interface QueryInputProps {
  query: string;
  setQuery: (query: string) => void;
  handleQuery: () => void;
  handleDeleteSelected: () => void;
  selectedNodesCount: number;
}

export const QueryInput: React.FC<QueryInputProps> = ({
  query,
  setQuery,
  handleQuery,
  handleDeleteSelected,
  selectedNodesCount,
}) => {
  return (
    <div className="flex items-center w-full">
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter your query"
        className="flex-grow mr-2"
      />
      <Button onClick={handleQuery} className="mr-2">Submit Query</Button>
      <Button
        onClick={handleDeleteSelected}
        variant="destructive"
        disabled={selectedNodesCount === 0}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Selected ({selectedNodesCount})
      </Button>
    </div>
  );
};