import { IMemberDTO } from "@collaro/member";
import { IUserDTO } from "@collaro/user";

export interface ISorting {
  sortby<T>(array: T[], key: keyof T, order?: "asc" | "desc"): T[];
}

abstract class Sorting implements ISorting {
  sortby<T>(array: T[], key: keyof T, order?: "asc" | "desc"): T[] {
    const sortOrder = order || "asc";
    const sortedArray = [...array].sort((a, b) => {
      if (a[key] < b[key]) {
        return sortOrder === "asc" ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return sortOrder === "asc" ? 1 : -1;
      }
      return 0;
    });
    return sortedArray;
  }
}

// Sorting the users based on their name in ascending order
export class UserSorting extends Sorting {
  override sortby<T>(array: T[], key: keyof T, order?: "asc" | "desc"): T[] {
    console.log(`Sorting by key: ${String(key)} in ${order} order`);
    return super.sortby(array, key, order);
  }

  sortUsersByName(users: IUserDTO[], order: "asc" | "desc" = "asc"): IUserDTO[] {
    return this.sortby(users, "name", order);
  }

  sortUsersByEmail(users: IUserDTO[], order: "asc" | "desc" = "asc"): IUserDTO[] {
    return this.sortby(users, "email", order);
  }

  sortUsersByCreationDate(users: IUserDTO[], order: "asc" | "desc" = "asc"): IUserDTO[] {
    return this.sortby(users, "createdAt", order);
  }
}

export class MemberSorting extends Sorting {
  sortByName(members: IMemberDTO[], order: "asc" | "desc" = "asc"): IMemberDTO[] {
    const sortedMembers = this.sortby(members, "name", order);
    return sortedMembers;    
  }

  sortByRole(members: IMemberDTO[], order: "asc" | "desc" = "asc"): IMemberDTO[] {
    const key: keyof IMemberDTO = "role";
    return this.sortby(members, key, order);
  }

  sortByCreationDate(members: IMemberDTO[], order: "asc" | "desc" = "asc"): IMemberDTO[] {
    const key: keyof IMemberDTO = "createdAt";
    return this.sortby(members, key, order);
  }
}

export class SortingFactory {
  static createUserSorting(): UserSorting {
    return new UserSorting();
  }

  static createMemberSorting(): MemberSorting {
    return new MemberSorting();
  }
}

const userSorting = SortingFactory.createUserSorting();
const memberSorting = SortingFactory.createMemberSorting();

export { userSorting, memberSorting };