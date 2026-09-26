import type {FilterOption} from '@/lib/types';

type TextFilter = {
  name: string;
  label: string;
  value: string;
  placeholder: string;
};

type SelectFilter = {
  name: string;
  label: string;
  value: string;
  options: FilterOption<string>[];
};

type TableFiltersProps = {
  basePath: string;
  textFilters: TextFilter[];
  selectFilters: SelectFilter[];
};

export const TableFilters = ({
  basePath,
  textFilters,
  selectFilters,
}: TableFiltersProps) => (
  <form className="table-filters" method="get" action={basePath}>
    {textFilters.map(filter => (
      <label key={filter.name} className="table-filter">
        <span>{filter.label}</span>
        <input
          className="filter-input"
          type="search"
          name={filter.name}
          defaultValue={filter.value}
          placeholder={filter.placeholder}
        />
      </label>
    ))}
    {selectFilters.map(filter => (
      <label key={filter.name} className="table-filter">
        <span>{filter.label}</span>
        <select
          className="filter-input"
          name={filter.name}
          defaultValue={filter.value}
        >
          {filter.options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    ))}
    <div className="table-filter-actions">
      <button className="btn btn--small" type="submit">
        Filtrar
      </button>
      <a className="btn btn--small btn--ghost" href={basePath}>
        Limpar
      </a>
    </div>
  </form>
);
