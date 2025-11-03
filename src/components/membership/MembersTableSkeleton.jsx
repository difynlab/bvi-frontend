import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function MembersTableSkeleton({ rows = 5 }) {
  return (
    <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i}>
            <td>
              <Skeleton height={16} width={40} />
            </td>
            <td>
              <Skeleton height={16} width={120} />
            </td>
            <td>
              <Skeleton height={16} width={150} />
            </td>
            <td>
              <Skeleton height={16} width={100} />
            </td>
            <td>
              <Skeleton height={16} width={60} />
            </td>
            <td>
              <Skeleton height={16} width={70} />
            </td>
            <td>
              <Skeleton height={16} width={100} />
            </td>
            <td>
              <Skeleton height={16} width={100} />
            </td>
            <td>
              <Skeleton height={32} width={120} borderRadius={4} />
            </td>
          </tr>
        ))}
      </tbody>
    </SkeletonTheme>
  );
}
